
using Bl.Api;
using Bl.Services;
using Dal.Api;
using Dal.Models;
using Dal.Services;
using Microsoft.EntityFrameworkCore;

namespace WebApi
{
    public class Program
    {

        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddCors(options => {
                options.AddPolicy("AllowFrontend", policy =>
                    policy.WithOrigins("http://localhost:3000").AllowAnyMethod().AllowAnyHeader());
            });
            // Add services to the container.

            //builder.Services.AddSingleton<IFamily, Bl.Services.FamilyService>();
            //builder.Services.AddSingleton<IFamilies, Dal.Services.FamiliesService>();
            //builder.Services.AddDbContext<DataManager>();

            builder.Services.AddDbContext<DataManager>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Use Scoped for services that depend on DbContext
            builder.Services.AddScoped<FamilyService>();
            builder.Services.AddScoped<IFamily,FamilyService>();
            builder.Services.AddScoped<IFamilies,FamiliesService>();


            // Register concrete type because FamilyService currently requests it directly
            builder.Services.AddScoped<FamiliesService>();
            builder.Services.AddScoped<VolunteerFreeTimeService>();
            builder.Services.AddScoped<Bl.Api.IVolunteerFreeTime, VolunteerFreeTimeService>();
            builder.Services.AddScoped<IVolunteersFreeTimes, VolunteersFreeTimesService>();


            // Register concrete type because FamilyService currently requests it directly
            builder.Services.AddScoped<Dal.Services.VolunteersFreeTimesService>();

            // Rides requsets
            builder.Services.AddScoped<Dal.Services.RideRequestService>();
            builder.Services.AddScoped<Bl.Services.RideRequestService>();


            // Volunteer requset
            builder.Services.AddScoped<Dal.Services.VolunteerService>();
            builder.Services.AddScoped<Bl.Services.VolunteerService>();

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.CustomSchemaIds(type => type.FullName); ;
            });
            var app = builder.Build();
            app.UseCors("AllowFrontend");

            // Create the database on first run and fill it with demo data
            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<DataManager>();
                db.Database.EnsureCreated();
                DbSeeder.Seed(db);
            }


            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
