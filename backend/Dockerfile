FROM python:3.12-slim

WORKDIR /app

# gosu — смена user в entrypoint после chown volume (без усложнения деплоя)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc gosu \
    && rm -rf /var/lib/apt/lists/* \
    && gosu nobody true \
    && useradd --create-home --uid 1000 --shell /usr/sbin/nologin vorota

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/media /app/staticfiles \
    && chmod +x entrypoint.sh \
    && chown -R vorota:vorota /app

EXPOSE 8000
# Стартуем от root только чтобы поправить права на volume media, затем gosu → vorota
CMD ["./entrypoint.sh"]
