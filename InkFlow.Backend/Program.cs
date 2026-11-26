using Microsoft.EntityFrameworkCore;
using InkFlow.Backend;
using Microsoft.Extensions.FileProviders;
var builder = WebApplication.CreateBuilder(args);

// 1. Включаем поддержку контроллеров
builder.Services.AddControllers();

// [ДОБАВЛЕНО] Настройка CORS: разрешаем фронтенду общаться с бэкендом
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // Адреса React-приложений
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Нужно для защищенных кук и JWT
    });
});

// 2. Регистрируем контекст базы данных и подключаем SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 3. Включаем Swagger для тестирования API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Настраиваем Swagger в режиме разработки
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// [ОБНОВЛЕНО] Жестко привязываем папку wwwroot/uploads к раздаче статики
var uploadsPath = Path.Combine(builder.Environment.WebRootPath ?? "wwwroot", "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(); // Раздача для корня wwwroot

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads" // По какому адресу в URL браузер будет искать файлы
});

app.UseCors("AllowReactApp");
// ... ваш остальной код (Authorization, Controllers и т.д.) ...


app.UseAuthorization();

// Автоматически ищем контроллеры в проекте
app.MapControllers();

app.Run();
