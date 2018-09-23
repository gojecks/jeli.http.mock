var jDistDirectory = './dist/';

module.exports = {
    options: {
        separator: '\n\n',
        process: true
    },
    jHttp: {
        dest: '<%= dir %>dist/jeli.http.js',
        src: ['<%= dir %>src/**/*.js']
    }
};