namespace Dal.Models;

/// <summary>Fills an empty database with fictional demo data so the app is usable right after the first run.</summary>
public static class DbSeeder
{
    public static void Seed(DataManager db)
    {
        if (db.Families.Any() || db.Volunteers.Any())
        {
            return;
        }

        var addresses = new[]
        {
            new Address { City = "Jerusalem", Neighborhood = "Ramot", Street = "HaPalmach", HouseNumber = 12 },
            new Address { City = "Jerusalem", Neighborhood = "Gilo", Street = "HaNassi", HouseNumber = 5 },
            new Address { City = "Bnei Brak", Neighborhood = "Zichron Meir", Street = "Rabbi Akiva", HouseNumber = 30 },
            new Address { City = "Beit Shemesh", Neighborhood = "Ramat Beit Shemesh", Street = "HaNachal", HouseNumber = 8 },
        };
        db.Addresses.AddRange(addresses);
        db.SaveChanges();

        var families = new[]
        {
            new Family { LastName = "Cohen", PhoneNumber = "0501234501", Email = "cohen@example.com", AddressId = addresses[0].Id, NumberOfPeople = 4 },
            new Family { LastName = "Levi", PhoneNumber = "0501234502", Email = "levi@example.com", AddressId = addresses[1].Id, NumberOfPeople = 2 },
            new Family { LastName = "Mizrahi", PhoneNumber = "0501234503", Email = "mizrahi@example.com", AddressId = addresses[2].Id, NumberOfPeople = 6 },
        };
        db.Families.AddRange(families);

        var volunteers = new[]
        {
            new Volunteer { FirstName = "David", LastName = "Katz", PhoneNumber = "0521234501", Email = "david@example.com", AddressId = addresses[0].Id, AvailableSeats = 4, IsBabySeat = true, IsActive = true },
            new Volunteer { FirstName = "Miriam", LastName = "Friedman", PhoneNumber = "0521234502", Email = "miriam@example.com", AddressId = addresses[3].Id, AvailableSeats = 3, IsCarHandicapped = true, IsActive = true },
            new Volunteer { FirstName = "Yossi", LastName = "Barak", PhoneNumber = "0521234503", AddressId = addresses[1].Id, AvailableSeats = 2, IsActive = false },
        };
        db.Volunteers.AddRange(volunteers);
        db.SaveChanges();

        var nextMonday = DateTime.Today.AddDays(((int)DayOfWeek.Monday - (int)DateTime.Today.DayOfWeek + 7) % 7 + 7);
        db.VolunteersFreeTimes.AddRange(
            new VolunteersFreeTime { VolunteerId = volunteers[0].Id, StartDateTime = nextMonday.AddHours(8), EndDateTime = nextMonday.AddHours(14) },
            new VolunteersFreeTime { VolunteerId = volunteers[1].Id, StartDateTime = nextMonday.AddDays(1).AddHours(9), EndDateTime = nextMonday.AddDays(1).AddHours(16) });

        db.RideRequests.AddRange(
            new RideRequest { FamilyId = families[0].Id!.Value, RideTime = nextMonday.AddHours(9), Status = 1 },
            new RideRequest { FamilyId = families[1].Id!.Value, VolunteerId = volunteers[0].Id, RideTime = nextMonday.AddHours(10), Status = 2 },
            new RideRequest { FamilyId = families[2].Id!.Value, VolunteerId = volunteers[1].Id, RideTime = nextMonday.AddDays(1).AddHours(11), Status = 3 });
        db.SaveChanges();
    }
}
