using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InkFlow.Backend.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace InkFlow.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // Полный путь: api/posts
    public class PostsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PostsController(AppDbContext context)
        {
            _context = context;
        }

        // 1. GET-запрос: Получить посты с фильтрацией по поисковому слову или тегу (api/posts)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetPosts([FromQuery] string? search = null, [FromQuery] int? currentUserId = null)
        {
            // Подтягиваем Автора и Теги, и СРАЗУ сортируем посты по убыванию даты (новые — вверх!)
            var query = _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Tags)
                .OrderByDescending(p => p.CreatedAt)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                string searchLower = search.Trim().ToLower();
                query = query.Where(p =>
                    p.Title.ToLower().Contains(searchLower) ||
                    p.Tags.Any(t => t.Name.ToLower().Contains(searchLower))
                );
            }

            var postsList = await query.ToListAsync();

            // Вытаскиваем все лайки для постов, чтобы посчитать их на основе реальных записей
            var allLikes = await _context.Likes.Where(l => l.TargetType.ToLower() == "post").ToListAsync();

            var result = postsList.Select(p => new
            {
                p.Id,
                p.Title,
                p.Content,
                p.CoverImageUrl,
                p.AudioUrl,
                p.CreatedAt,
                p.AuthorId,
                p.FileUrl,
                AuthorName = p.Author != null ? p.Author.Username : "Неизвестный автор",
                Tags = p.Tags != null ? p.Tags.Select(t => t.Name).ToList() : new List<string>(),

                // [ИСПРАВЛЕНО] Просто берем готовые физические цифры из таблицы Posts!
                LikesCount = p.LikesCount,
                DislikesCount = p.DislikesCount,

                // Флаги покраски кнопок (они сбросятся в false при выходе, но цифры останутся!)
                LikedByMe = currentUserId.HasValue && _context.Likes.Any(l => l.TargetId == p.Id && l.TargetType.ToLower() == "post" && l.UserId == currentUserId.Value && l.IsLike == true),
                DislikedByMe = currentUserId.HasValue && _context.Likes.Any(l => l.TargetId == p.Id && l.TargetType.ToLower() == "post" && l.UserId == currentUserId.Value && l.IsLike == false)
            }).ToList();

            return Ok(result);

        }





        // 2. POST-запрос: Создать новый пост (api/posts)
        // 2. POST-запрос: Создать новый пост с поддержкой тегов (api/posts)
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
        {
            var author = await _context.Users.FindAsync(dto.AuthorId);
            if (author == null) return BadRequest("Автор не найден.");
            if (author.IsBanned) return BadRequest("Ваш аккаунт заблокирован. Публикация невозможна.");

            var authorExists = await _context.Users.AnyAsync(u => u.Id == dto.AuthorId);
            if (!authorExists)
            {
                return BadRequest("Указанный автор не найден в системе.");
            }

            // 1. Сначала создаем и сохраняем чистый пост, чтобы получить его ID из базы
            var newPost = new Post
            {
                Title = dto.Title,
                Content = dto.Content,
                CoverImageUrl = dto.CoverImageUrl,
                AudioUrl = dto.AudioUrl, // [ДОБАВЛЕНО]
                AuthorId = dto.AuthorId,
                FileUrl = dto.FileUrl,
                CreatedAt = DateTime.UtcNow
            };


            _context.Posts.Add(newPost);
            await _context.SaveChangesAsync(); // Пост сохранился, теперь newPost.Id заполнен!

            // 2. Теперь, если теги были переданы, привязываем их вручную через SQL-логику
            if (!string.IsNullOrWhiteSpace(dto.TagsString))
            {
                var tagNames = dto.TagsString
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(t => t.Trim().ToLower())
                    .Distinct();

                foreach (var tagName in tagNames)
                {
                    // Ищем тег в базе, если его нет — создаем новый
                    var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == tagName);
                    if (tag == null)
                    {
                        tag = new Tag { Name = tagName };
                        _context.Tags.Add(tag);
                        await _context.SaveChangesAsync(); // Сохраняем тег, чтобы у него тоже появился Id
                    }

                    // [НАДЕЖНЫЙ ВАРИАНТ] Напрямую выполняем SQL-команду вставки в таблицу-переходник
                    // Это исключает любые капризы со стороны автоматического маппинга коллекции EF Core
                    await _context.Database.ExecuteSqlRawAsync(
                        "INSERT INTO PostTags (PostId, TagId) VALUES ({0}, {1})",
                        newPost.Id, tag.Id
                    );
                }
            }

            return Ok(new { message = "Пост успешно опубликован!", postId = newPost.Id });
        }
        // 3. GET-запрос: Получить только закладки пользователя (api/posts/bookmarks/1)
        [HttpGet("bookmarks/{userId}")]
        public async Task<IActionResult> GetBookmarkedPosts(int userId)
        {
            // Находим ID всех постов, которые лайкнул (сохранил) этот юзер
            var bookmarkedPostIds = await _context.Likes
                .Where(l => l.UserId == userId && l.TargetType.ToLower() == "post" && l.IsLike == true)
                .Select(l => l.TargetId)
                .ToListAsync();

            // Вытаскиваем сами посты
            var posts = await _context.Posts
                .Where(p => bookmarkedPostIds.Contains(p.Id))
                .Include(p => p.Author)
                .Include(p => p.Tags)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var result = posts.Select(p => new
            {
                p.Id,
                p.Title,
                p.Content,
                p.CoverImageUrl,
                p.CreatedAt,
                p.AuthorId,
                AuthorName = p.Author != null ? p.Author.Username : "Автор",
                Tags = p.Tags != null ? p.Tags.Select(t => t.Name).ToList() : new List<string>(),
                LikedByMe = true // Так как это список закладок, они точно сохранены мной
            }).ToList();

            return Ok(result);
        }
        // 4. PUT-запрос: Редактировать существующий пост (api/posts/5)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdatePostDto dto)
        {
            var post = await _context.Posts.Include(p => p.Tags).FirstOrDefaultAsync(p => p.Id == id);
            if (post == null)
                return NotFound("Публикация не найдена.");

            // Проверяем, что редактирует именно автор поста (или админ)
            var user = await _context.Users.FindAsync(dto.UserId);
            if (post.AuthorId != dto.UserId && (user == null || user.Role != "Admin"))
                return Forbid("У вас нет прав на редактирование этой записи.");

            post.Title = dto.Title;
            post.Content = dto.Content;
            post.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(dto.CoverImageUrl))
                post.CoverImageUrl = dto.CoverImageUrl;
            if (!string.IsNullOrEmpty(dto.FileUrl))
                post.FileUrl = dto.FileUrl;

            if (!string.IsNullOrEmpty(dto.AudioUrl))
                post.AudioUrl = dto.AudioUrl;

            // Обновляем теги, если они переданы
            if (dto.TagsString != null)
            {
                // Удаляем старые связи тегов для этого поста
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM PostTags WHERE PostId = {0}", post.Id);

                var tagNames = dto.TagsString
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(t => t.Trim().ToLower())
                    .Distinct();

                foreach (var tagName in tagNames)
                {
                    var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == tagName);
                    if (tag == null)
                    {
                        tag = new Tag { Name = tagName };
                        _context.Tags.Add(tag);
                        await _context.SaveChangesAsync();
                    }

                    await _context.Database.ExecuteSqlRawAsync(
                        "INSERT INTO PostTags (PostId, TagId) VALUES ({0}, {1})",
                        post.Id, tag.Id
                    );
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Публикация успешно обновлена!" });
        }

        // 5. DELETE-запрос: Удалить пост (api/posts/5?userId=1)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(int id, [FromQuery] int userId)
        {
            var post = await _context.Posts.FindAsync(id);
            if (post == null)
                return NotFound("Публикация не найдена.");

            var user = await _context.Users.FindAsync(userId);
            if (post.AuthorId != userId && (user == null || user.Role != "Admin"))
                return Forbid("У вас нет прав на удаление этой записи.");

            // Каскадно подчищаем связанные записи, чтобы база данных не ругалась на внешние ключи
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM PostTags WHERE PostId = {0}", id);
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Comments WHERE PostId = {0}", id);
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Likes WHERE TargetId = {0} AND TargetType = 'post'", id);

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Публикация безвозвратно удалена." });
        }

    }

    public class CreatePostDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public int AuthorId { get; set; }
        public string? TagsString { get; set; } // [НОВОЕ] Строка с тегами вида: "programming, react, dotnet"
        public string? AudioUrl { get; set; }
        public string? FileUrl { get; set; }


    }
    public class UpdatePostDto
    {
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public string? AudioUrl { get; set; }
        public string? TagsString { get; set; }
        public string? FileUrl { get; set; }

    }


}
