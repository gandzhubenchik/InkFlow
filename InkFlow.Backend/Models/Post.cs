using System;
using System.Collections.Generic;

namespace InkFlow.Backend.Models
{
    public class Post
    {
        public int Id { get; set; }
        public int AuthorId { get; set; }
        public int LikesCount { get; set; } = 0;
        public int DislikesCount { get; set; } = 0;

        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Связь: у поста есть один автор
        public User? Author { get; set; }

        // Связь: у поста может быть много комментариев и тегов
        public List<Comment> Comments { get; set; } = new();
        public List<Tag> Tags { get; set; } = new();
        // Добавь это свойство внутрь класса Post в файле Post.cs
        public string? AudioUrl { get; set; }
        public string? FileUrl { get; set; }

    }
}
