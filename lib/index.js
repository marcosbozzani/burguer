function cook() {
    console.log('cooking burguer')
    const burguer = 'burguer-' + Math.random() * 1000

    console.log('burguer done')
    return burguer
}

module.exports = {
    cook
}