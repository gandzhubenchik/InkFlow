using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;

namespace InkFlow.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Файл не выбран или пуст.");

            try
            {
                // 1. Путь к папке wwwroot/uploads на сервере
                string uploadsFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads");

                // Если папки нет — создаем её физически на диске
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                // 2. Генерируем уникальное имя файла (например, 3b25a1..._photo.jpg)
                string uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(file.FileName);
                string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // 3. Сохраняем файл на диск сервера
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                // 4. Формируем URL-ссылку, по которой фронтенд сможет открыть этот файл
                // Бэкенд работает на порту 5228
                string fileUrl = $"http://localhost:5228/uploads/{uniqueFileName}";

                return Ok(new { url = fileUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Внутренняя ошибка сервера: {ex.Message}");
            }
        }
    }
}
