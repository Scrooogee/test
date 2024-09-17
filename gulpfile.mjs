import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';  // Import imagemin-mozjpeg
import imageminOptipng from 'imagemin-optipng';  // Import imagemin-optipng
import imageminSvgo from 'imagemin-svgo';        // Import imagemin-svgo
import browserSync from 'browser-sync';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';
import sourcemaps from 'gulp-sourcemaps';
import cleanCSS from 'gulp-clean-css';
import mediaQueries from 'gulp-group-css-media-queries';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import htmlMin from 'gulp-htmlmin';
import svgstore from 'gulp-svgstore';
import { deleteAsync } from 'del';
import rename from 'gulp-rename';
import replace from 'gulp-replace';

// Set Dart Sass as the compiler for gulp-sass
const sassCompiler = gulpSass(dartSass);

// Image Optimization Task
function optimizeImagesTask() {
    return gulp.src(['app/img/**/*.{png,jpg,svg}', '!app/img/sprite.svg', '!app/img/icons/*.svg'])
        .pipe(imagemin([
            imageminMozjpeg({ quality: 75, progressive: true }),  // Use imagemin-mozjpeg
            imageminOptipng({ optimizationLevel: 3 }),  // Use imagemin-optipng
            imageminSvgo({  // Use imagemin-svgo for SVG optimization
                plugins: [
                    { removeViewBox: false },
                    { cleanupIDs: false }
                ]
            })
        ]))
        .pipe(gulp.dest('dist/img'));
}

function browserSyncTask(done) {
    browserSync({
        server: {
            baseDir: 'app'
        },
        notify: false
    });
    done();
}

function sassTask() {
    return gulp.src('app/sass/**/*.+(scss|sass)')
        .pipe(sourcemaps.init())
        .pipe(sassCompiler({ outputStyle: 'expanded' }))
        .pipe(postcss([autoprefixer()]))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({ stream: true }));
}

function cleanTask(done) {
    deleteAsync('dist').then(() => done());
}

function cssTask() {
    return gulp.src('app/sass/**/*.+(scss|sass)')
        .pipe(sassCompiler())
        .pipe(mediaQueries())
        .pipe(postcss([autoprefixer()]))
        .pipe(cleanCSS())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/css'));
}

function htmlTask() {
    return gulp.src('app/*.html')
        .pipe(replace('style.css', 'style.min.css'))
        .pipe(htmlMin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist'));
}

function svgSpriteTask() {
    return gulp.src("app/img/icons/*.svg")
        .pipe(svgstore({
            inlineSvg: true
        }))
        .pipe(rename("sprite.svg"))
        .pipe(gulp.dest("app/img"));
}

function codeTask() {
    return gulp.src('app/*.html')
        .pipe(browserSync.reload({ stream: true }));
}

function copyDistTask(done) {
    gulp.src('app/fonts/**/*.*')
        .pipe(gulp.dest('dist/fonts'));
    done();
}

function watchTask(done) {
    gulp.watch('app/sass/**/*.+(scss|sass)', sassTask);
    gulp.watch('app/img/icons/*.svg', svgSpriteTask);
    gulp.watch('app/*.html', codeTask);
    done();
}

export const build = gulp.series(cleanTask, cssTask, htmlTask, optimizeImagesTask, copyDistTask);

export default gulp.parallel(sassTask, browserSyncTask, watchTask);

