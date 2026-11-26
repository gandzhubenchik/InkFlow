using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InkFlow.Backend.Models;
using BCrypt.Net;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace InkFlow.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Пользователь с таким Email уже существует.");

            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                return BadRequest("Этот никнейм уже занят.");

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var newUser = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = passwordHash,
                Role = "Reader"
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok("Регистрация прошла успешно!");
        }

        // [ДОБАВЛЕНО] Метод авторизации (Вход)
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            // Ищем пользователя по Email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                return BadRequest("Неверный Email или пароль.");

            // Проверяем, совпадает ли введенный пароль с хэшем из базы данных
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (user.IsBanned)
                return BadRequest($"Ваш аккаунт заблокирован администратором. Причина: {user.BanReason}");
            if (!isPasswordValid)
                return BadRequest("Неверный Email или пароль.");

            // Если всё ок — генерируем JWT-токен ("цифровой паспорт")
            var tokenHandler = new JwtSecurityTokenHandler();
            // Секретный ключ (минимум 16 символов), в продакшене он выносится в конфигурацию
            var key = Encoding.ASCII.GetBytes("InkFlowSuperSecretKey2026StrongKey!");

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                // Зашиваем в токен ID пользователя, его имя и роль
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, user.Role)
                }),
                Expires = DateTime.UtcNow.AddDays(7), // Токен будет жить неделю
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            // Возвращаем токен и базовые данные пользователя фронтенду
            return Ok(new
            {
                token = tokenString,
                userId = user.Id,
                username = user.Username,
                role = user.Role
            });
        }
    }

    public class RegisterDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // [ДОБАВЛЕНО] DTO для входа
    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
