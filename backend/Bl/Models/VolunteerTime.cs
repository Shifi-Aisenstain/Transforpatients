using Dal.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Bl.Models
{
    public class VolunteerTime
    {

        public int Id { get; set; }

        public int VolunteerId { get; set; }

        public DateTime StartDateTime { get; set; }

        public DateTime EndDateTime { get; set; }

        public string? Destination { get; set; }

        public Bl.Models.Volunteer? Volunteer { get; set; } 
    }
}

