module.exports = {
    jHttp: {
        files: [
            '<%= dir %>src/**/*.js'
        ],
        tasks: ['clean:jDist',
            'concat:jHttp',
            'uglify:jHttp',
            'clean:jAfterBuild'
        ]
    }
};