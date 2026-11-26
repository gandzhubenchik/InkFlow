namespace InkFlow.Backend.Models
{
    public class Like
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int TargetId { get; set; } // ID поста или ID комментария
        public string TargetType { get; set; } = string.Empty; // "Post" или "Comment"
        public bool IsLike { get; set; } // true = лайк, false = дизлайк

        public User? User { get; set; }
    }
}
