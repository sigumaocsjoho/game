FROM php:8.2-apache

# ★ ここが超重要：MySQL PDO を入れる
RUN docker-php-ext-install pdo pdo_mysql

# アプリを配置
COPY . /var/www/html/

# 権限設定
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Apache 設定（403 Forbidden 対策）
RUN echo '<Directory /var/www/html>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/custom.conf \
    && a2enconf custom \
    && a2enmod rewrite

EXPOSE 80
