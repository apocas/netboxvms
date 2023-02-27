var Exporter = require('../lib/exporter');
const axiosm = require('axios');
const https = require('https');
const VMManager = require('vmmanager6');

//https://www.ispsystem.com/vmmanager
class VMM6 extends Exporter {
  constructor(conf) {
    super(process.env.VMM6_CLUSTER || conf.cluster);

    this.name = 'VMM6';

    this.axios = axiosm.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    this.tag = process.env.VMM6_TAG || 'vmm6-'

    this.vmmanager = new VMManager({
      "hostname": process.env.VMM6_HOSTNAME || conf.hostname,
      "username": process.env.VMM6_USERNAME || conf.username,
      "password": process.env.VMM6_PASSWORD || conf.password
    });
  }

  async getVMs() {
    const response = await this.vmmanager.getVms();
    const vmList = response.list;

    var output = [];

    for (let i = 0; i < vmList.length; i++) {
      const vm = vmList[i];

      var vm_output = {
        name: vm.name,
        display_name: vm.name,
        virtual_machine_id: this.tag + vm.id,
        vcpus: vm.cpu_number,
        memory: vm.ram_mib,
        disk: parseInt(parseInt(vm.disk.disk_mib) / 1024),
        ip_addresses: [],
        status: 'offline'
      };

      if (vm.ip4) {
        for (let j = 0; j < vm.ip4.length; j++) {
          vm_output.ip_addresses.push(vm.ip4[j].ip)
        }
      }

      if (vm.state == 'active') {
        vm_output.status = 'active';
      } else {
        vm_output.status = 'offline';
      }

      if (vm.cluster.id == 7) {
        vm_output.site = 2;
      } else {
        vm_output.site = 1;
      }

      output.push(vm_output);
    }
    return output;
  }
}



module.exports = VMM6;