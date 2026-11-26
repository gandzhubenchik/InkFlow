using Microsoft.EntityFrameworkCore;
using InkFlow.Backend.Models;

namespace InkFlow.Backend
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Регистрируем все таблицы в базе данных
        public DbSet<User> Users { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<Like> Likes { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }

        // Этот метод нужен, чтобы настроить связь многие-ко-многим (Посты <-> Теги)
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Настраиваем промежуточную таблицу PostTags для связи Постов и Тегов
            modelBuilder.Entity<Post>()
                .HasMany(p => p.Tags)
                .WithMany(t => t.Posts)
                .UsingEntity<Dictionary<string, object>>(
                    "PostTags", // Имя таблицы в SSMS
                    j => j.HasOne<Tag>().WithMany().HasForeignKey("TagId"),  // Явно указываем имя колонки TagId
                    j => j.HasOne<Post>().WithMany().HasForeignKey("PostId")  // Явно указываем имя колонки PostId
                );
        }

    }
}
