const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(n: number): string {
  if (n === 0) return '';
  
  if (n < 20) {
    return ones[n];
  }
  
  if (n < 100) {
    const tenDigit = Math.floor(n / 10);
    const remainder = n % 10;
    return `${tens[tenDigit]}${remainder > 0 ? ' ' + ones[remainder] : ''}`;
  }
  
  const hundredDigit = Math.floor(n / 100);
  const remainder = n % 100;
  const remainderText = remainder > 0 ? ` ${convertLessThanThousand(remainder)}` : '';
  return `${ones[hundredDigit]} Hundred${remainderText}`;
}

export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Zero Rupees Only';
  }

  // Handle rounding and precision cleanly
  const roundedAmount = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(roundedAmount);
  const decimalPart = Math.round((roundedAmount - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return 'Zero Rupees Only';
  }

  let result = '';

  if (integerPart > 0) {
    let num = integerPart;

    const crores = Math.floor(num / 10000000);
    num %= 10000000;

    const lakhs = Math.floor(num / 100000);
    num %= 100000;

    const thousands = Math.floor(num / 1000);
    num %= 1000;

    const hundredsAndBelow = num;

    const parts: string[] = [];

    if (crores > 0) {
      parts.push(`${convertLessThanThousand(crores)} Crore`);
    }

    if (lakhs > 0) {
      parts.push(`${convertLessThanThousand(lakhs)} Lakh`);
    }

    if (thousands > 0) {
      parts.push(`${convertLessThanThousand(thousands)} Thousand`);
    }

    if (hundredsAndBelow > 0) {
      parts.push(convertLessThanThousand(hundredsAndBelow));
    }

    result = parts.join(' ');

    if (integerPart === 1) {
      result += ' Rupee';
    } else {
      result += ' Rupees';
    }
  }

  if (decimalPart > 0) {
    const paiseText = convertLessThanThousand(decimalPart);
    if (result.length > 0) {
      result += ` and ${paiseText} Paise`;
    } else {
      result = `${paiseText} Paise`;
    }
  }

  return `${result} Only`.replace(/\s+/g, ' ').trim();
}
