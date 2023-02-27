const axiosm = require('axios');
const https = require('https');

class Netbox {
  constructor(config, cluster) {
    this.axios = axiosm.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    this.config = config;
    this.cluster = cluster;

    this.vms = undefined;
  }

  async getVMs(cluster) {
    var vms = await this.axios.get('/api/virtualization/virtual-machines/?cluster_id=' + this.cluster + '&limit=0', this.config);
    return vms.data;
  }

  async getVMDetailsbyName(name) {
    if (this.vms === undefined) {
      var vms = await this.getVMs();
      this.vms = vms;
    }
    var vm = this.vms.results.find(vm => vm.name == name);
    return vm;
  }

  async getVMInterfaces(vm) {
    var interfaces = await this.axios.get('/api/virtualization/interfaces/?virtual_machine=' + vm, this.config);
    return interfaces.data.results;
  }

  async getVMAdresses(vm) {
    var addresses = await this.axios.get('/api/ipam/ip-addresses/?virtual_machine=' + vm, this.config);
    return addresses.data.results;
  }

  async deleteVM(id) {
    await this.axios.delete('/api/virtualization/virtual-machines/' + id + "/", this.config);
  }

  async addVM(device, existingID) {
    const name = device.virtual_machine_id;
    const data = {
      name: name,
      status: device.status,
      cluster: this.cluster,
      vcpus: device.vcpus,
      memory: device.memory,
      disk: device.disk,
      comments: device.display_name
    };

    var vm = await this.getVMDetailsbyName(name);

    if (existingID) {
      if (this.compareVM(data, vm) === false) {
        await this.axios.patch('/api/virtualization/virtual-machines/' + existingID + '/', data, this.config);
        console.log(`VM ${name} updated.`);
      } else {
        console.log(`VM ${name} is up-to-date.`);
      }
    } else {
      data.name = name;
      await this.axios.post('/api/virtualization/virtual-machines/', data, this.config);
      console.log(`VM ${name} created.`);
    }
  }

  async compareVM(vm, existingvm) {
    if (vm.display_name != existingvm.comments) {
      return false;
    }

    if (vm.vcpus != existingvm.vcpus) {
      return false;
    }

    if (vm.memory != existingvm.memory) {
      return false;
    }

    if (vm.disk != existingvm.disk) {
      return false;
    }

    if (vm.cluster != existingvm.cluster) {
      return false;
    }

    if (vm.comments != existingvm.comments) {
      return false;
    }

    if (vm.status != existingvm.status.value) {
      return false;
    }

    return true;
  }

  async addInterface(name, vm) {
    var vmo = await this.getVMDetailsbyName(vm);

    var data = {
      name: name,
      virtual_machine: vmo.id,
      type: 'virtual',
      enabled: true,
      mtu: 1500
    };

    await this.axios.post('/api/virtualization/interfaces/', data, this.config);
  }

  async getAddress(address) {
    var addresses = await this.axios.get('/api/ipam/ip-addresses/?address=' + address, this.config);
    if (addresses.data.count > 0) {
      return addresses.data.results[0];
    } else {
      return null;
    }
  }

  async addAddress(address, vm, interf) {
    var inters = await this.getVMInterfaces(vm);

    if (inters.length === 0) {
      throw new Error(`No interfaces found for VM ${vm}`);
    }

    var inter = inters.find(inter => inter.name == interf);

    if (!inter) {
      throw new Error(`No specific interface found for VM ${vm}`);
    }

    var data = {
      address: address,
      status: 'active',
      description: vm,
      assigned_object_type: 'virtualization.vminterface',
      assigned_object_id: inter.id
    };

    const existingAddress = await this.getAddress(address);

    if (existingAddress !== null) {
      if (existingAddress.assigned_object.virtual_machine.name != vm) {
        await this.axios.put('/api/ipam/ip-addresses/' + existingAddress.id + '/', data, this.config);
        console.log(`IP ${address} updated.`);
      } else {
        console.log(`IP ${address} is up-to-date.`);
      }
    } else {
      await this.axios.post('/api/ipam/ip-addresses/', data, this.config);
      console.log(`IP ${address} added.`);
    }
  }
}

module.exports = Netbox;