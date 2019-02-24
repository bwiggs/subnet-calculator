class CIDR {
  constructor(cidr) {
    let parts = cidr.split('/');

    this.ip = this.parseOctets(parts[0]);
    this.networkbits = parseInt(parts[1]);
    this.wildcard = ((1 << 32 - this.networkbits) - 1)
    this.subnetMask = 0xFFFFFFFF - this.wildcard;
    this.network = this.subnetMask & this.ip;
    this.broadcast = this.ip | this.wildcard;
    this.hosts = this.wildcard - 2;

    const classbits = (this.ip >> 24)
    if (!(classbits & 0x80)) {
      this.class = 'A'; // ip binary starts with 0
    } else if (classbits & 192) {
      this.class = 'C'; // ip binary starts with 11
    } else if (classbits & 128) {
      this.class = 'B'; // ip binary starts with 10
    }
  }

  parseOctets(ip) {
    return ip
      .split('.')
      .reduce((val, octet) => (val << 8) | parseInt(octet), 0);
  }
}

class IPv4 {
  static toBinary(n) {
    return [
      ((n >> 24) & 0xff).toString(2).padStart(8, '0'),
      ((n >> 16) & 0xff).toString(2).padStart(8, '0'),
      ((n >> 8) & 0xff).toString(2).padStart(8, '0'),
      ((n >> 0) & 0xff).toString(2).padStart(8, '0')
    ].join('.');
  }

  static toOctets(n) {
    return [
      ((n >> 24) & 0xff).toString(10),
      ((n >> 16) & 0xff).toString(10),
      ((n >> 8) & 0xff).toString(10),
      ((n >> 0) & 0xff).toString(10)
    ].join('.');
  }
}

Vue.component('ip', {
  props: ['title', 'ip', 'netmask'],
  filters: {
    toOctets: IPv4.toOctets,
    toBinary: IPv4.toBinary,
  },
  methods: {
    binary: function (val) {
      return IPv4.toBinary(val);
    },
    spanClass: function (bit, index) {
      // offset the bitidx to handle '.' in the ip format.
      const bitIdx = (index - Math.floor((index / 9))) + 1;
      return {
        b: bit !== '.',
        s: bit === '.',
        off: bit === '0',
        on: bit === '1',
        n: bitIdx <= this.netmask,
        h: bitIdx > this.netmask
      };
    }
  },
  template: `
  <div>
    <h1>{{title}} - {{ip | toOctets}}</h1>
    <div class="binary">
      <span v-for="(bit, index) in binary(ip).split('')" v-bind:class="spanClass(bit, index)">{{bit}}</span>
    </div>
  </div>
  `
});

var app = new Vue({
  el: '#subnet-calculator',
  created: function () {
    let params = {}
    let hashParams = window.location.hash.slice(1).split('&').forEach((h) => {
      let pts = h.split('=')
      params[pts[0]] = pts[1]
    })
    if (params.cidr) {
      this.input = params.cidr;
      this.cidr = new CIDR(params.cidr);
    }
  },
  data: {
    input: '8.8.8.8/24',
    cidr: new CIDR('8.8.8.8/24'),
  },
  methods: {
    onchange: function (input) {
      this.cidr = new CIDR(input);
    },
  },
  filters: {
    toOctets: function (n) {
      return [
        ((n >> 24) & 0xff).toString(10),
        ((n >> 16) & 0xff).toString(10),
        ((n >> 8) & 0xff).toString(10),
        ((n >> 0) & 0xff).toString(10)
      ].join('.');
    },
    toBinary: function (n) {
      return [
        ((n >> 24) & 0xff).toString(2).padStart(8, '0'),
        ((n >> 16) & 0xff).toString(2).padStart(8, '0'),
        ((n >> 8) & 0xff).toString(2).padStart(8, '0'),
        ((n >> 0) & 0xff).toString(2).padStart(8, '0')
      ].join('.');
    }
  }
});