using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InkFlow.Backend.Models;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace InkFlow.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SubscriptionsController(AppDbContext context)
        {
            _context = context;
        }

        // 1. POST: Подписаться или отписаться (api/subscriptions/toggle)
        [HttpPost("toggle")]
        public async Task<IActionResult> ToggleSubscription([FromBody] SubsDto dto)
        {
            if (dto.SubscriberId == dto.AuthorId)
                return BadRequest("Нельзя подписаться на самого себя.");

            var existingSub = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.SubscriberId == dto.SubscriberId && s.AuthorId == dto.AuthorId);

            if (existingSub != null)
            {
                _context.Subscriptions.Remove(existingSub);
                await _context.SaveChangesAsync();
                return Ok(new { status = "Unsubscribed", message = "Вы отписались от автора" });
            }

            var newSub = new Subscription
            {
                SubscriberId = dto.SubscriberId,
                AuthorId = dto.AuthorId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Subscriptions.Add(newSub);
            await _context.SaveChangesAsync();
            return Ok(new { status = "Subscribed", message = "Вы успешно подписались!" });
        }

        // 2. GET: Проверить статус подписки (api/subscriptions/status?subscriberId=1&authorId=2)
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus([FromQuery] int subscriberId, [FromQuery] int authorId)
        {
            var isSubscribed = await _context.Subscriptions
                .AnyAsync(s => s.SubscriberId == subscriberId && s.AuthorId == authorId);
            return Ok(new { isSubscribed });
        }

        // 3. GET: Лента постов только от подписок (api/subscriptions/feed/1)
        [HttpGet("feed/{subscriberId}")]
        public async Task<IActionResult> GetSubsFeed(int subscriberId)
        {
            // Находим ID всех авторов, на которых подписан юзер
            var authorIds = await _context.Subscriptions
                .Where(s => s.SubscriberId == subscriberId)
                .Select(s => s.AuthorId)
                .ToListAsync();

            // Вытаскиваем посты этих авторов
            var posts = await _context.Posts
                .Where(p => authorIds.Contains(p.AuthorId))
                .Include(p => p.Author)
                .Include(p => p.Tags)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var allLikes = await _context.Likes.Where(l => l.TargetType == "Post").ToListAsync();

            var result = posts.Select(p => new
            {
                p.Id,
                p.Title,
                p.Content,
                p.CoverImageUrl,
                p.CreatedAt,
                p.AuthorId,
                AuthorName = p.Author != null ? p.Author.Username : "Автор",
                Tags = p.Tags.Select(t => t.Name).ToList(),
                LikesCount = allLikes.Count(l => l.TargetId == p.Id && l.IsLike),
                DislikesCount = allLikes.Count(l => l.TargetId == p.Id && !l.IsLike)
            }).ToList();

            return Ok(result);
        }
    }

    public class SubsDto
    {
        public int SubscriberId { get; set; }
        public int AuthorId { get; set; }
    }
}
