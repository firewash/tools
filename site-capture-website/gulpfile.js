const gulp = require('gulp');

gulp.task('bg', () => {
    gulp.src('src/**').pipe(gulp.dest('build'));
});

gulp.task('third-web-lib', () => {
    gulp.src('node_modules/jquery/dist/jquery.js')
        .pipe(gulp.dest('build/public/jquery'));

    gulp.src('node_modules/vue/dist/vue.js')
        .pipe(gulp.dest('build/public/vue'));

    gulp.src('node_modules/bootstrap/dist/**')
        .pipe(gulp.dest('build/public/bootstrap'));
});

gulp.task('watch', () => {
    gulp.watch('src/**', ['bg']);
});

gulp.task('default', ['bg', 'third-web-lib', 'watch'], () => {

});
