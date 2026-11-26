using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InkFlow.Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace InkFlow.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CommentsController(AppDbContext context)
        {
            _context = context;
        }

        // 1. GET: Получить дерево комментариев для конкретного поста (api/comments/post/5)
        [HttpGet]
        [Route("post/{postId}")]
        public async Task<IActionResult> GetCommentsForPost(int postId, [FromQuery] int? currentUserId = null)
        {
            var comments = await _context.Comments
                .Where(c => c.PostId == postId)
                .Include(c => c.Author)
                .ToListAsync();

            var allLikes = await _context.Likes.Where(l => l.TargetType.ToLower() == "comment").ToListAsync();

            var result = comments.Select(c => new
            {
                c.Id,
                c.PostId,
                c.ParentCommentId,
                c.Text,
                c.CreatedAt,
                AuthorName = c.Author != null ? c.Author.Username : "Гость",

                // [ИСПРАВЛЕНО] Просто берем готовые цифры из таблицы Comments!
                LikesCount = c.LikesCount,
                DislikesCount = c.DislikesCount,

                LikedByMe = currentUserId.HasValue && _context.Likes.Any(l => l.TargetId == c.Id && l.TargetType.ToLower() == "comment" && l.UserId == currentUserId.Value && l.IsLike == true),
                DislikedByMe = currentUserId.HasValue && _context.Likes.Any(l => l.TargetId == c.Id && l.TargetType.ToLower() == "comment" && l.UserId == currentUserId.Value && l.IsLike == false)
            }).ToList();

            return Ok(result);
        }




        // 2. POST: Написать комментарий (или ответить на существующий) (api/comments)
        [HttpPost]
        public async Task<IActionResult> CreateComment([FromBody] CreateCommentDto dto)
        {
            var author = await _context.Users.FindAsync(dto.AuthorId);
            if (author != null && author.IsBanned) return BadRequest("Вы забанены.");
            if (author != null && author.IsMuted) return BadRequest("Администратор ограничил вам возможность отправлять мнения.");
            // Проверяем, существует ли пост
            if (!await _context.Posts.AnyAsync(p => p.Id == dto.PostId))
                return BadRequest("Пост не найден.");

            // Проверяем, существует ли автор комментария
            if (!await _context.Users.AnyAsync(u => u.Id == dto.AuthorId))
                return BadRequest("Пользователь не найден.");

            // Если это ответ на другой комментарий, проверяем его существование
            if (dto.ParentCommentId.HasValue)
            {
                var parentExists = await _context.Comments.AnyAsync(c => c.Id == dto.ParentCommentId.Value);
                if (!parentExists)
                    return BadRequest("Родительский комментарий не найден.");
            }

            var newComment = new Comment
            {
                PostId = dto.PostId,
                AuthorId = dto.AuthorId,
                ParentCommentId = dto.ParentCommentId,
                Text = dto.Text,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(newComment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Комментарий успешно добавлен!", commentId = newComment.Id });
        }
    }

    public class CreateCommentDto
    {
        public int PostId { get; set; }
        public int AuthorId { get; set; }
        public int? ParentCommentId { get; set; } // null для обычного коммента, ID для ответа
        public string Text { get; set; } = string.Empty;
    }
}
