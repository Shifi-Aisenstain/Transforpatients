using System;
using Bl.Models;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dal.Api;

namespace Bl.Api
{
    public interface IFamily // :ICrud<FullFamily>
	{
        bool Create(FullFamily entity);
        List<Family> GetAll();
    }
}