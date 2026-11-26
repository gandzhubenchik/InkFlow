using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InkFlow.Backend.Models;
using System.Threading.Tasks;
using System.Linq;

namespace InkFlow.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Получить список всех пользователей (для админ-панели)
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new { u.Id, u.Username, u.Email, u.Role, u.IsBanned, u.IsMuted, u.BanReason })
                .ToListAsync();
            return Ok(users);
        }

        // 2. ЗАБАНЯТЬ ПОЛЬЗОВАТЕЛЯ
        [HttpPost("ban")]
        public async Task<IActionResult> BanUser([FromBody] AdminActionDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return NotFound("Пользователь не найден.");
            if (user.Role == "Admin") return BadRequest("Нельзя забанить администратора.");

            user.IsBanned = true;
            user.BanReason = dto.Reason ?? "Нарушение правил сообщества";
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Пользователь {user.Username} успешно забанен." });
        }

        // 3. РАЗБАНЯТЬ ПОЛЬЗОВАТЕЛЯ
        [HttpPost("unban/{userId}")]
        public async Task<IActionResult> UnbanUser(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("Пользователь не найден.");

            user.IsBanned = false;
            user.BanReason = null;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Пользователь {user.Username} разбанен." });
        }

        // 4. ЗАМУТИТЬ ПОЛЬЗОВАТЕЛЯ (запрет комментов)
        [HttpPost("mute")]
        public async Task<IActionResult> MuteUser([FromBody] AdminActionDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return NotFound("Пользователь не найден.");
            if (user.Role == "Admin") return BadRequest("Нельзя выдать мут администратору.");

            user.IsMuted = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Пользователю {user.Username} заблокирована отправка мнений." });
        }

        // 5. СНЯТЬ МУТ
        [HttpPost("unmute/{userId}")]
        public async Task<IActionResult> UnmuteUser(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("Пользователь не найден.");

            user.IsMuted = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Пользователю {user.Username} возвращено право голоса." });
        }

        // 6. УДАЛИТЬ ЛЮБОЙ КОММЕНТАРИЙ (Модерация)
        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null) return NotFound("Комментарий уже удален.");

            // Переписываем текст комментария, чтобы ветка ответов ниже не ломалась (канонично для форумов)
            comment.Text = "🚨 Этот комментарий был удален модератором за нарушение правил InkFlow.";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Комментарий успешно заблокирован." });
        }
    }

    public class AdminActionDto
    {
        public int UserId { get; set; }
        public string? Reason { get; set; }
    }
}
