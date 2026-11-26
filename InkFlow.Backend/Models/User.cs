using System;

namespace InkFlow.Backend.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Reader"; // Reader, Author, Admin
        public string? AvatarUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // [НОВЫЕ ПОЛЯ ДЛЯ МОДЕРАЦИИ]
        public bool IsBanned { get; set; } = false;
        public bool IsMuted { get; set; } = false;
        public string? BanReason { get; set; }
    }
}
