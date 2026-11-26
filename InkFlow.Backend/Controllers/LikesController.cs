using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InkFlow.Backend.Models;
using System.Threading.Tasks;

namespace InkFlow.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LikesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LikesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("toggle")]
        public async Task<IActionResult> ToggleLike([FromBody] ToggleLikeDto dto)
        {
            string type = dto.TargetType.ToLower();

            // 1. Ищем существующую оценку этого юзера в таблице Likes
            var existingLike = await _context.Likes
                .FirstOrDefaultAsync(l => l.UserId == dto.UserId &&
                                          l.TargetId == dto.TargetId &&
                                          l.TargetType.ToLower() == type);

            if (existingLike != null)
            {
                if (existingLike.IsLike == dto.IsLike)
                {
                    // Кликнули на то же самое — полностью УДАЛЯЕМ строку (отмена лайка)
                    _context.Likes.Remove(existingLike);
                }
                else
                {
                    // Кликнули на противоположное — меняем тип
                    existingLike.IsLike = dto.IsLike;
                }
            }
            else
            {
                // Оценки не было — создаем новую запись в СУБД
                var newLike = new Like
                {
                    UserId = dto.UserId,
                    TargetId = dto.TargetId,
                    TargetType = type,
                    IsLike = dto.IsLike
                };
                _context.Likes.Add(newLike);
            }

            // Намертво сохраняем запись связи в таблице Likes
            await _context.SaveChangesAsync();

            // 2. [ИСПРАВЛЕНО] Выполняем жесткий SQL-пересчет через интерполяцию строк ($)
            // База данных физически посчитает количество строк в Likes и запишет точную цифру в ячейку поста/коммента
            if (type == "post")
            {
                await _context.Database.ExecuteSqlRawAsync(
                    $"UPDATE Posts SET LikesCount = (SELECT COUNT(*) FROM Likes WHERE TargetId = {dto.TargetId} AND TargetType = 'post' AND IsLike = 1) WHERE Id = {dto.TargetId}");
                await _context.Database.ExecuteSqlRawAsync(
                    $"UPDATE Posts SET DislikesCount = (SELECT COUNT(*) FROM Likes WHERE TargetId = {dto.TargetId} AND TargetType = 'post' AND IsLike = 0) WHERE Id = {dto.TargetId}");
            }
            else if (type == "comment")
            {
                await _context.Database.ExecuteSqlRawAsync(
                    $"UPDATE Comments SET LikesCount = (SELECT COUNT(*) FROM Likes WHERE TargetId = {dto.TargetId} AND TargetType = 'comment' AND IsLike = 1) WHERE Id = {dto.TargetId}");
                await _context.Database.ExecuteSqlRawAsync(
                    $"UPDATE Comments SET DislikesCount = (SELECT COUNT(*) FROM Likes WHERE TargetId = {dto.TargetId} AND TargetType = 'comment' AND IsLike = 0) WHERE Id = {dto.TargetId}");
            }

            return Ok(new { message = "База данных успешно пересчитана!" });
        }
    }

    public class ToggleLikeDto
    {
        public int UserId { get; set; }
        public int TargetId { get; set; }
        public string TargetType { get; set; } = string.Empty;
        public bool IsLike { get; set; }
    }
}
