(function(i) {
    let stateArr = i.split('');
    let version = '';
    for (let p = 0; p < stateArr.length; p++) version += stateArr[p] + (p < stateArr.length - 1 ? '.' : '');
    return version;
})(input)
