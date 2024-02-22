// Usage: e.g.  toItemScript="scale.js?f=10&rw=r"

(function(input) {
    let result = parseFloat(input);
    let factor = parseFloat(f);
    let read = rw == 'r';

    if (read) result /= factor;
    else result *= factor;

    return result;
})(input)
