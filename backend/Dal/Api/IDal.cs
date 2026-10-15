using Dal.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dal.Api
{
    public interface IDal
    {
        VolunteerService Volunteers { get; }
        FamiliesService Families { get; }
        AddressesService Addresses { get; }
        RideRequestService RideRequest { get; }
        VolunteersFreeTimesService VolonteersFreeTimes { get; }
        RideFrequencyService RideFrequency { get; }
    }
}
