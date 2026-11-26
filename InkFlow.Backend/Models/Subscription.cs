using System;

namespace InkFlow.Backend.Models
{
    public class Subscription
    {
        public int Id { get; set; }
        public int SubscriberId { get; set; }
        public int AuthorId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? Subscriber { get; set; }
        public User? Author { get; set; }
    }
}
