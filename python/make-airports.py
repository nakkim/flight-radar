#/usr/bin/env python3
import csv
import json
import sys
import time
from urllib.request import urlretrieve

def reporthook(count, block_size, total_size):
    # Report download progress
    # https://blog.shichao.io/2012/10/04/progress_speed_indicator_for_urlretrieve_in_python.html
    global start_time
    if count == 0:
        start_time = time.time()
        return
    duration = time.time() - start_time
    progress_size = int(count * block_size)
    speed = int(progress_size / (1024 * duration))
    percent = min(int(count*block_size*100/total_size),100)
    sys.stdout.write("\r...%d%%, %d MB, %d KB/s, %d seconds passed" %
                    (percent, progress_size / (1024 * 1024), speed, duration))
    sys.stdout.flush()

def download_files():
    # Download airports.csv and countries.csv from the given URL
    url = "https://davidmegginson.github.io/ourairports-data"
    required_files = ["airports.csv", "countries.csv"]

    try:
      for filename in required_files:
        file_url = f"{url}/{filename}"
        print(f"Downloading {filename} from {file_url}...")
        urlretrieve(file_url, filename, reporthook)
        print(f"\n{filename} downloaded successfully.")
    except Exception as e:
      print(f"Error downloading files: {e}")

def resolve_countries(continent_filter=None, include_countries=None):
    # Read countries.csv and create a mapping of country codes to (country name, continent).
    country_mapping = {}

    print('Resolveing countries with filters:')
    print(f'  continent_filter: {continent_filter}')
    print(f'  include_countries: {include_countries}')

    # Parse continent_filter (can be a string, comma-separated string, or list)
    continent_filters = set()
    if continent_filter:
        if isinstance(continent_filter, str):
            items = [item.strip() for item in continent_filter.split(",") if item.strip()]
        else:
            items = [str(item).strip() for item in continent_filter if str(item).strip()]
        continent_filters = {item.upper() for item in items}

    # Parse include_countries (can be a string, comma-separated string, or list)
    include_codes = set()
    include_names = set()
    if include_countries:
        if isinstance(include_countries, str):
            items = [item.strip() for item in include_countries.split(",") if item.strip()]
        else:
            items = [str(item).strip() for item in include_countries if str(item).strip()]

        include_codes = {item.upper() for item in items if len(item) == 2}
        include_names = {item.casefold() for item in items}

    with open("countries.csv", "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = (row.get("code") or "").strip().upper()
            name = (row.get("name") or "").strip()
            continent = (row.get("continent") or "").strip().upper()

            if not code or not name:
                continue

            matches_continent = (
                not continent_filters or continent in continent_filters
            )
            matches_include = (
                code in include_codes or name.casefold() in include_names
            )

            # include_countries extends continent results when both are provided.
            if continent_filters and (include_codes or include_names):
                if not (matches_continent or matches_include):
                    continue
            elif continent_filters:
                if not matches_continent:
                    continue
            elif include_codes or include_names:
                if not matches_include:
                    continue

            country_mapping[code] = (name, continent)

    print(f"Resolved {len(country_mapping)} countries matching filters.")
    print(f"Included countries: {', '.join([f'{code} ({name})' for code, (name, _) in country_mapping.items()])}")
    return country_mapping

def resolve_airports(country_mapping):
    # Read airports.csv and create a list of airports with their details, including country name and continent.
    airports = []

    with open("airports.csv", "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                if (row.get("type") or "").strip().lower() != "large_airport":
                    continue
                airport_id = int(row.get("id", "").strip())
                name = (row.get("name") or "").strip()
                city = (row.get("city") or "").strip()
                country_code = (row.get("iso_country") or "").strip().upper()
                iata_code = (row.get("iata_code") or "").strip().upper()
                ident = (row.get("ident") or "").strip().upper()
                latitude = float(row.get("latitude_deg", "0").strip())
                longitude = float(row.get("longitude_deg", "0").strip())
            except ValueError:
                continue

            if country_code not in country_mapping:
                continue

            country_info = country_mapping[country_code]
            country_name, continent = country_info

            airport_data = {
                "id": airport_id,
                "icao_code": ident,
                "name": name,
                "city": city,
                "country_code": country_code,
                "country_name": country_name,
                "continent": continent,
                "iata_code": iata_code,
                "latitude": latitude,
                "longitude": longitude
            }
            airports.append(airport_data)

    print(f"Resolved {len(airports)} airports matching country filters.")
    return airports

if __name__ == "__main__":
    download_files()
    countries = resolve_countries(['EU'])
    airports = resolve_airports(countries)
    with open("../frontend/public/airports.json", "w", encoding="utf-8") as f:
        json.dump(airports, f, ensure_ascii=False, indent=2)
        print(f"Saved {len(airports)} airports to frontend/public/airports.json")
        print("File size:", f.tell(), "bytes")
