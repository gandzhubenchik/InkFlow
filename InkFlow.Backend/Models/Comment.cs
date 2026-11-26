using System;

namespace InkFlow.Backend.Models
{
    public class Comment
    {
        public int Id { get; set; }
        public int PostId { get; set; }
        public int AuthorId { get; set; }
        public int LikesCount { get; set; } = 0;
        public int DislikesCount { get; set; } = 0;

        public int? ParentCommentId { get; set; } // Для древовидной структуры
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Навигационные свойства для Entity Framework
        public Post? Post { get; set; }
        public User? Author { get; set; }
        public Comment? ParentComment { get; set; }
    }
}
