module.exports = {
    all: ['Gruntfile.js', '<%= dir %>src/**/*.js'],
    allInApp: ['<%= dir %>src/**/*.js'],
    options: {
        force: true,
        jshintrc: true
    }
};