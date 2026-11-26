using System.Collections.Generic;

namespace InkFlow.Backend.Models
{
    public class Tag
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        // Связь: один тег может быть привязан ко многим постам
        public List<Post> Posts { get; set; } = new();
    }
}
