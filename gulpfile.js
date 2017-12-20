var gulp           = require('gulp'),
		gutil          = require('gulp-util' ),
		sass           = require('gulp-sass'),
		browserSync    = require('browser-sync'),
		concat         = require('gulp-concat'),
		uglify         = require('gulp-uglify'),
		rename         = require('gulp-rename'),
		del            = require('del'),
		imagemin       = require('gulp-imagemin'),
		cache          = require('gulp-cache'),
		ftp            = require('vinyl-ftp'),
		notify         = require('gulp-notify'),
		rsync          = require('gulp-rsync'),
		pug            = require('gulp-pug'),
		pugBeautify    = require('gulp-pug-beautify'),
		postcss        = require('gulp-postcss'),
		plumber        = require('gulp-plumber'),
		autoprefixer   = require('autoprefixer'),
		sourcemaps     = require('gulp-sourcemaps'),
		cssnano        = require('cssnano')({preset: 'default'}),
		mqpacker       = require('css-mqpacker'),
		sortCSSmq      = require('sort-css-media-queries');

// Пользовательские скрипты проекта

gulp.task('default', ['watch']);

gulp.task('pug', function(){
	// return gulp.src('app/pug/**/*.pug')
	return gulp.src('app/pug/pages/!(_)*.pug')
	.pipe(plumber())
	.pipe(pug({
		pretty: true
	}))
	.pipe(pugBeautify({
		// omit_empty_lines:   true,
		fill_tab:           true,
		tab_size:           2
	}))
	.pipe(gulp.dest('app'))
	.pipe(browserSync.reload({stream: true}))
});

gulp.task('watch', ['pug', 'sass', 'js', 'browser-sync'], function() {
	global.watch = true;
	gulp.watch('app/pug/**/*.pug', ['pug']);
	gulp.watch('app/sass/**/*.sass', ['sass']);
	gulp.watch(['libs/**/*.js', 'app/js/common.js'], ['js']);
	gulp.watch('app/*.html', browserSync.reload);
});

gulp.task('sass', function() {
	var processors = [
		autoprefixer({
			browsers: ['> 1%', 'last 2 versions']
		}),
		// cssnano,
		mqpacker({
			// sort: sortCSSmq           // mobile -first
			sort: sortCSSmq.desktopFirst // desktop-first
		})
	];
	return gulp.src('app/sass/**/*.sass')
	.pipe(sourcemaps.init())
	.pipe(sass().on("error", notify.onError()))
	.pipe(rename({suffix: '.min', prefix : ''}))
	.pipe(postcss(processors))
	.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.reload({stream: true}))
});

gulp.task('build', ['removedist', 'imagemin', 'sass', 'js'], function() {
	var buildFiles = gulp.src([
		'app/*.html',
		'app/.htaccess'
	]).pipe(gulp.dest('dist'));
	var buildCss = gulp.src([
		'app/css/main.min.css'
	]).pipe(gulp.dest('dist/css'));
	var buildJs = gulp.src([
		'app/js/scripts.min.js'
	]).pipe(gulp.dest('dist/js'));
	var buildFonts = gulp.src([
		'app/fonts/**/*'
	]).pipe(gulp.dest('dist/fonts'));
});

gulp.task('common-js', function() {
	return gulp.src([
		'app/js/common.js'
	])
	.pipe(plumber())
	.pipe(concat('common.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('app/js'));
});

gulp.task('js', ['common-js'], function() {
	return gulp.src([
		'app/libs/jquery/dist/jquery.min.js',
		'app/js/common.min.js' // Всегда в конце
	])
	.pipe(plumber())
	.pipe(concat('scripts.min.js'))
	// .pipe(uglify()) // Минимизировать весь js (на выбор)
	.pipe(gulp.dest('app/js'))
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: 'app'
		},
		notify: false
		// tunnel: true,
		// tunnel: "projectmane", //Demonstration page: http://projectmane.localtunnel.me
	});
});

gulp.task('imagemin', function() {
	return gulp.src('app/img/**/*')
	.pipe(cache(imagemin())) // Cache Images
	.pipe(gulp.dest('dist/img'));
});

gulp.task('deploy', function() {
	var conn = ftp.create({
		host:      'hostname.com',
		user:      'username',
		password:  'userpassword',
		parallel:  10,
		log: gutil.log
	});
	var globs = [
		'dist/**',
		'dist/.htaccess'
	];
	return gulp.src(globs, {buffer: false})
	.pipe(conn.dest('/path/to/folder/on/server'));
});

gulp.task('rsync', function() {
	return gulp.src('dist/**')
	.pipe(rsync({
		root: 'dist/',
		hostname: 'username@yousite.com',
		destination: 'yousite/public_html/',
		// include: ['*.htaccess'], // Скрытые файлы, которые необходимо включить в деплой
		recursive: true,
		archive: true,
		silent: false,
		compress: true
	}));
});

gulp.task('removedist', function() { return del.sync('dist')});
gulp.task('clearcache', function () { return cache.clearAll()});


