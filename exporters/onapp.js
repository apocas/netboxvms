var Exporter = require('../lib/exporter');
const axiosm = require('axios');
const https = require('https');

//https://docs.onapp.com/apim/latest
class Onapp extends Exporter {
  constructor(conf) {
    super(process.env.ONAPP_CLUSTER || conf.cluster);

    this.name = 'Onapp';

    this.axios = axiosm.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    this.tag = process.env.ONAPP_TAG || 'onapp-'

    this.config = {
      "baseURL": process.env.ONAPP_HOSTNAME || conf.hostname,
      "auth": {
        "username": process.env.ONAPP_USERNAME || conf.username,
        "password": process.env.ONAPP_PASSWORD || conf.password
      }
    }
  }

  async getVMs() {
    const response = await this.axios.get('/virtual_machines.json', this.config);
    const vmList = response.data;

    var output = [];

    for (let i = 0; i < vmList.length; i++) {
      const vm = vmList[i].virtual_machine;

      var vm_output = {
        name: vm.hostname,
        display_name: vm.label,
        virtual_machine_id: this.tag + vm.identifier,
        vcpus: vm.cpus,
        memory: vm.memory,
        disk: vm.total_disk_size,
        ip_addresses: [],
        status: 'offline'
      };

      if (vm.ip_addresses) {
        for (let j = 0; j < vm.ip_addresses.length; j++) {
          vm_output.ip_addresses.push(vm.ip_addresses[j].ip_address.address)
        }
      }

      if (vm.booted == true) {
        vm_output.status = 'active';
      } else {
        vm_output.status = 'offline';
      }

      output.push(vm_output);
    }
    return output;
  }
}

module.exports = Onapp;