using System;
using System.Collections.Generic;

namespace Dal.Models;

public partial class VolunteersFreeTime
{
    public int Id { get; set; }

    public int VolunteerId { get; set; }

    public DateTime StartDateTime { get; set; }

    public DateTime EndDateTime { get; set; }

    public virtual Volunteer Volunteer { get; set; } = null!;
}
