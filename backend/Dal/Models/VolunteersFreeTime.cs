using System;
using System.Collections.Generic;

namespace Dal.Models;

public partial class VolunteersFreeTime
{
    public int Id { get; set; }

    public int VolunteerId { get; set; }

    public DateTime StartDateTime { get; set; }

    public DateTime EndDateTime { get; set; }

    /// <summary>Free text: where the volunteer is driving to in this time slot (his direction).</summary>
    public string? Destination { get; set; }

    public virtual Volunteer Volunteer { get; set; } = null!;
}
