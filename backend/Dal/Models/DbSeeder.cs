namespace Dal.Models;

/// <summary>
/// Fills an empty database with fictional demo data (families, volunteers, availability and rides)
/// so the matching screen has something to work with right after the first run.
/// All dates are relative to "today", so the data is always in the near future.
/// </summary>
public static class DbSeeder
{
    private const string Hadassah = "הדסה עין כרם, ירושלים";
    private const string ShaareZedek = "שערי צדק, ירושלים";
    private const string Schneider = "שניידר, פתח תקווה";
    private const string Beilinson = "בילינסון, פתח תקווה";
    private const string Sheba = "שיבא תל השומר, רמת גן";
    private const string Ichilov = "איכילוב, תל אביב";
    private const string Rambam = "רמב\"ם, חיפה";
    private const string Soroka = "סורוקה, באר שבע";
    private const string MeirKfarSaba = "מאיר, כפר סבא";

    private const string DirJerusalem = "ירושלים";
    private const string DirCenter = "תל אביב והמרכז";
    private const string DirPetahTikva = "פתח תקווה והשרון";
    private const string DirNorth = "חיפה והצפון";
    private const string DirSouth = "באר שבע והדרום";

    public static void Seed(DataManager db)
    {
        if (db.Families.Any() || db.Volunteers.Any())
        {
            return;
        }

        var addresses = new[]
        {
            Addr("ירושלים", "רמות", "שמואל הנביא", 12),            // 0
            Addr("ירושלים", "גילה", "הנשיא", 5),                   // 1
            Addr("בני ברק", "זכרון מאיר", "רבי עקיבא", 30),         // 2
            Addr("בית שמש", "רמת בית שמש", "הנחל", 8),             // 3
            Addr("מודיעין עילית", "קרית ספר", "הרב שך", 14),       // 4
            Addr("פתח תקווה", "כפר גנים", "הרצל", 21),             // 5
            Addr("ירושלים", "בית וגן", "בית וגן", 40),             // 6
            Addr("תל אביב", "פלורנטין", "וולפסון", 9),             // 7
            Addr("ביתר עילית", "הר נוף", "הגר\"א", 17),            // 8
            Addr("אשדוד", "רובע ד", "הרצל", 3),                    // 9
            Addr("רמת גן", "קרית קריניצי", "ז'בוטינסקי", 55),      // 10
            Addr("חיפה", "הדר", "הנביאים", 23),                    // 11
            Addr("באר שבע", "נווה זאב", "רגר", 70),                // 12
            Addr("ירושלים", "הר נוף", "קהילת ציון", 6),            // 13
            Addr("כפר סבא", "נווה שרת", "ויצמן", 18),              // 14
            Addr("ראשון לציון", "נחלת יהודה", "הרצל", 44),         // 15
        };
        db.Addresses.AddRange(addresses);
        db.SaveChanges();

        var families = new[]
        {
            Fam("כהן", "0501234501", 0, 4),
            Fam("לוי", "0501234502", 1, 2),
            Fam("מזרחי", "0501234503", 2, 6),
            Fam("ביטון", "0501234504", 3, 5),
            Fam("אברמוביץ", "0501234505", 4, 3),
            Fam("פרץ", "0501234506", 5, 4),
            Fam("שטרן", "0501234507", 6, 2),
            Fam("אוחנה", "0501234508", 7, 3),
            Fam("גרין", "0501234509", 8, 7),
            Fam("חדד", "0501234510", 9, 4),
            Fam("רוזן", "0501234511", 10, 2),
            Fam("דיין", "0501234512", 11, 3),
            Fam("סעדון", "0501234513", 12, 5),
            Fam("ויס", "0501234514", 14, 4),
        };
        foreach (var f in families) { f.AddressId = addresses[f.AddressId!.Value].Id; }
        db.Families.AddRange(families);

        var volunteers = new[]
        {
            Vol("דוד", "כץ", "0521234501", 0, 4, baby: true),                        // 0
            Vol("מרים", "פרידמן", "0521234502", 3, 3, handicapped: true),            // 1
            Vol("יוסי", "ברק", "0521234503", 1, 2, active: false),                   // 2
            Vol("שרה", "לוי", "0521234504", 2, 4, baby: true),                       // 3
            Vol("אברהם", "גולדשטיין", "0521234505", 4, 6),                           // 4
            Vol("רחל", "אזולאי", "0521234506", 5, 3),                                // 5
            Vol("משה", "דהן", "0521234507", 6, 4, handicapped: true),                // 6
            Vol("חנה", "רוזנבוים", "0521234508", 7, 3, baby: true),                  // 7
            Vol("יעקב", "שפירא", "0521234509", 8, 7),                                // 8
            Vol("לאה", "מזרחי", "0521234510", 9, 3),                                 // 9
            Vol("נתן", "אורבך", "0521234511", 10, 4, handicapped: true),             // 10
            Vol("תמר", "בן דוד", "0521234512", 11, 3, baby: true),                   // 11
            Vol("אליהו", "כהן", "0521234513", 12, 4),                                // 12
            Vol("דבורה", "קליין", "0521234514", 13, 5),                              // 13
        };
        foreach (var v in volunteers) { v.AddressId = addresses[v.AddressId!.Value].Id; }
        db.Volunteers.AddRange(volunteers);
        db.SaveChanges();

        var baseDay = DateTime.Today.AddDays(1);
        DateTime At(int day, int hour) => baseDay.AddDays(day - 1).AddHours(hour);

        // (volunteer, day, from hour, to hour, direction)
        var slots = new (int Vol, int Day, int From, int To, string Dir)[]
        {
            (0, 1, 8, 14, DirJerusalem), (0, 3, 7, 12, DirCenter), (0, 8, 8, 15, DirJerusalem),
            (1, 2, 9, 16, DirJerusalem), (1, 4, 8, 13, DirJerusalem), (1, 9, 9, 14, DirCenter),
            (2, 2, 8, 12, DirJerusalem),
            (3, 1, 9, 15, DirCenter), (3, 2, 10, 16, DirPetahTikva), (3, 7, 8, 14, DirCenter),
            (4, 1, 7, 12, DirJerusalem), (4, 3, 8, 17, DirCenter), (4, 5, 7, 13, DirJerusalem),
            (5, 2, 8, 14, DirPetahTikva), (5, 4, 9, 15, DirCenter), (5, 8, 8, 12, DirPetahTikva),
            (6, 1, 10, 17, DirJerusalem), (6, 3, 9, 14, DirJerusalem), (6, 6, 8, 16, DirCenter),
            (7, 2, 8, 13, DirCenter), (7, 5, 9, 16, DirCenter), (7, 9, 9, 15, DirPetahTikva),
            (8, 1, 6, 12, DirJerusalem), (8, 2, 7, 14, DirJerusalem), (8, 7, 7, 13, DirCenter),
            (9, 3, 9, 15, DirSouth), (9, 4, 8, 14, DirCenter), (9, 9, 8, 16, DirSouth),
            (10, 1, 8, 13, DirCenter), (10, 5, 8, 15, DirCenter), (10, 8, 10, 16, DirPetahTikva),
            (11, 2, 9, 15, DirNorth), (11, 6, 8, 14, DirNorth), (11, 10, 9, 16, DirNorth),
            (12, 3, 8, 14, DirSouth), (12, 6, 9, 15, DirSouth), (12, 10, 8, 13, DirCenter),
            (13, 1, 9, 16, DirJerusalem), (13, 4, 8, 14, DirJerusalem), (13, 7, 9, 15, DirCenter),
        };
        db.VolunteersFreeTimes.AddRange(slots.Select(s => new VolunteersFreeTime
        {
            VolunteerId = volunteers[s.Vol].Id,
            StartDateTime = At(s.Day, s.From),
            EndDateTime = At(s.Day, s.To),
            Destination = s.Dir,
        }));

        string Origin(int famIdx)
        {
            var a = addresses.First(x => x.Id == families[famIdx].AddressId);
            return $"{a.City}, {a.Street} {a.HouseNumber}";
        }

        // (family, day, hour, destination, status 1=new 2=in progress 3=approved, volunteer or -1, regular)
        var rides = new (int Fam, int Day, int Hour, string Dest, int Status, int Vol, bool Regular)[]
        {
            // already handled
            (0, 1, 9, Hadassah, 3, 0, true), (1, 1, 10, ShaareZedek, 2, 13, false), (2, 2, 10, Ichilov, 3, 7, false),
            (3, 3, 9, Soroka, 2, 12, false), (4, 4, 11, Hadassah, 3, 1, true), (5, 5, 10, Sheba, 2, 10, false),
            (6, 6, 9, Rambam, 3, 11, false), (7, 2, 11, Schneider, 2, 5, false), (8, 7, 9, Ichilov, 3, 3, true),
            // waiting for a volunteer
            (9, 1, 9, ShaareZedek, 1, -1, false), (10, 1, 11, Ichilov, 1, -1, false), (11, 2, 9, Sheba, 1, -1, false),
            (12, 2, 12, Hadassah, 1, -1, false), (13, 2, 10, Rambam, 1, -1, false), (0, 3, 10, Soroka, 1, -1, false),
            (1, 3, 9, Beilinson, 1, -1, false), (2, 4, 10, ShaareZedek, 1, -1, true), (3, 4, 9, Ichilov, 1, -1, false),
            (4, 5, 8, Schneider, 1, -1, false), (5, 5, 9, Hadassah, 1, -1, false), (6, 6, 10, Soroka, 1, -1, false),
            (7, 6, 9, MeirKfarSaba, 1, -1, false), (8, 7, 10, Sheba, 1, -1, false), (9, 8, 9, Hadassah, 1, -1, true),
            (10, 8, 11, Beilinson, 1, -1, false), (11, 9, 10, Ichilov, 1, -1, false), (12, 9, 9, Soroka, 1, -1, false),
            (13, 10, 10, Rambam, 1, -1, false), (0, 10, 9, Schneider, 1, -1, false), (1, 4, 13, Sheba, 1, -1, false),
            (2, 9, 11, Hadassah, 1, -1, false), (3, 8, 10, ShaareZedek, 1, -1, false), (5, 3, 11, Ichilov, 1, -1, false),
        };
        db.RideRequests.AddRange(rides.Select(r => new RideRequest
        {
            FamilyId = families[r.Fam].Id!.Value,
            VolunteerId = r.Vol >= 0 ? volunteers[r.Vol].Id : null,
            RideTime = At(r.Day, r.Hour),
            Status = r.Status,
            RegularRide = r.Regular,
            Origin = Origin(r.Fam),
            Destination = r.Dest,
        }));
        db.SaveChanges();
    }

    private static Address Addr(string city, string neighborhood, string street, int number) =>
        new() { City = city, Neighborhood = neighborhood, Street = street, HouseNumber = number };

    // AddressId temporarily holds the index into the addresses array; it is replaced by the real id before saving.
    private static Family Fam(string lastName, string phone, int addressIdx, int people) =>
        new() { LastName = lastName, PhoneNumber = phone, Email = $"{phone}@example.com", AddressId = addressIdx, NumberOfPeople = people };

    private static Volunteer Vol(string first, string last, string phone, int addressIdx, int seats,
        bool baby = false, bool handicapped = false, bool active = true) =>
        new()
        {
            FirstName = first, LastName = last, PhoneNumber = phone, Email = $"{phone}@example.com",
            AddressId = addressIdx, AvailableSeats = seats, IsBabySeat = baby, IsCarHandicapped = handicapped, IsActive = active,
        };
}
