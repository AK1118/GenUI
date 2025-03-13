

test('object assignment', () => {
    const data = { one: 1 };
    data['two'] = 2;
    expect(data).toEqual({ one: 1, two:2 });
});

test('Is 3 add to 4 equal to 7?', () => {
    const n=0.1+0.2
    expect(n).toBeCloseTo(0.3)
});