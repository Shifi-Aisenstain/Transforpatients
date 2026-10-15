
using Dal.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Bl.Models
{
    public class FullFamily
    {
        public int? Id { get; set; }

        public string? LastName { get; set; } = null!;

        public string? PhoneNumber { get; set; } = null!;

        public string? Email { get; set; }

        public int? AddressId { get; set; }

        public int? NumberOfPeople { get; set; }

        public virtual Address? Address { get; set; } = null!;

        public virtual ICollection<RideRequest>? RideRequests { get; set; } = new List<RideRequest>();
    }
}
