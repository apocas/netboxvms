var Exporter = require('./exporter');

class Example extends Exporter {
  constructor(cluster) {
    super(cluster);
    this.name = 'Example';

    this.tag = process.env.EXAMPLE_TAG || 'example-'

    //init...
  }

  //return a list of VMs, example vm object
  async getVMs() {
    var output = [
      {
        name: 'xpto',
        display_name: 'xpto.example.com',
        virtual_machine_id: this.tag + '123456',
        vcpus: 2,
        memory: 2048,
        disk: 10,
        ip_addresses: ['127.0.0.1'],
        status: 'online'
      },
      //...
    ];

    return output;
  }
}

module.exports = Example;