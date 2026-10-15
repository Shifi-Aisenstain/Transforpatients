using Dal.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Bl.Models
{
    public class Volunteer
    {
        public int Id { get; set; }

        public string? FirstName { get; set; }

        public string LastName { get; set; } = null!;

        public string PhoneNumber { get; set; } = null!;

        public string? Email { get; set; }

        public int? AddressId { get; set; }

        public bool IsCarHandicapped { get; set; }

        public int? AvailableSeats { get; set; }

        public bool IsBabySeat { get; set; }

        public bool IsActive { get; set; }

        public virtual AddressForScreen? Address { get; set; } = null!;

        public virtual ICollection<RideRequest> RideRequests { get; set; } = new List<RideRequest>();

        public virtual ICollection<VolunteersFreeTime> VolunteersFreeTimes { get; set; } = new List<VolunteersFreeTime>();
    }
}
