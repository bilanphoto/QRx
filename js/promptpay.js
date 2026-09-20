/**
 * PromptPay EMVCo QR Code Payload Generator
 * Supports Thai Mobile Numbers, National ID, and optional amount.
 */
(function(window) {
  function formatField(id, value) {
    var valStr = String(value);
    var lenStr = ('00' + valStr.length).slice(-2);
    return id + lenStr + valStr;
  }

  function calculateCRC16(data) {
    var crc = 0xFFFF;
    for (var i = 0; i < data.length; i++) {
      var c = data.charCodeAt(i);
      var x = ((crc >> 8) ^ c) & 0xFF;
      x ^= x >> 4;
      crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
    }
    var hex = crc.toString(16).toUpperCase();
    return ('0000' + hex).slice(-4);
  }

  window.PromptPay = {
    generatePayload: function(target, amount) {
      if (!target) return '';
      // Remove spaces, hyphens, parentheses
      var clean = target.replace(/[^0-9]/g, '');

      var subTag = '';
      if (clean.length === 10 && clean.indexOf('0') === 0) {
        // Thai mobile: 08x-xxx-xxxx -> 00668xxxxxxxx
        var intlMobile = '0066' + clean.substring(1);
        subTag = formatField('01', intlMobile);
      } else if (clean.length === 13) {
        // Thai National ID / Tax ID
        subTag = formatField('02', clean);
      } else if (clean.length === 15) {
        // e-Wallet ID
        subTag = formatField('03', clean);
      } else {
        // Default to mobile format if other length
        subTag = formatField('01', clean);
      }

      var tag29 = formatField('00', 'A000006770011101') + subTag;

      var numAmount = parseFloat(amount);
      var hasAmount = !isNaN(numAmount) && numAmount > 0;

      var parts = [
        formatField('00', '01'),
        formatField('01', hasAmount ? '12' : '11'),
        formatField('29', tag29),
        formatField('58', 'TH'),
        formatField('53', '764') // THB currency code
      ];

      if (hasAmount) {
        parts.push(formatField('54', numAmount.toFixed(2)));
      }

      var raw = parts.join('') + '6304';
      var checksum = calculateCRC16(raw);
      return raw + checksum;
    }
  };
})(window);
