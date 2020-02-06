package main

import (
	"encoding/csv"
	"io"
	"os"
	"strings"
)

var nameToCountry map[string]Country

type Country struct {
	ContinentCode string
	Name          string
}

func getContinentByCountryName(name string) (string, error) {
	if nameToCountry == nil {
		countries, err := loadCountries()
		if err != nil {
			return "", err
		}

		nameToCountry = make(map[string]Country)
		for _, country := range countries {
			nameToCountry[strings.ToLower(country.Name)] = country
		}
	}

	country, ok := nameToCountry[strings.ToLower(name)]
	if ok {
		return country.ContinentCode, nil
	}
	return "", nil
}

func loadCountries() ([]Country, error) {
	file, err := os.Open("configs/countries.csv")
	if err != nil {
		return nil, err
	}
	//noinspection GoUnhandledErrorResult
	defer file.Close()

	reader := csv.NewReader(file)
	reader.Comma = '\t'
	reader.Comment = '#'

	result := make([]Country, 0, 200)
	for {
		record, err := reader.Read()
		if err != nil {
			if err == io.EOF {
				return result, nil
			}

			if err, ok := err.(*csv.ParseError); !ok || err.Err != csv.ErrFieldCount {
				return result, err
			}
		}

		//isoNum, err := strconv.Atoi(record[2])
		//if err != nil {
		//  return nil, err
		//}

		result = append(result, Country{
			//ISO:           record[0],
			//ISO3:          record[1],
			//ISONum:        isoNum,
			Name: record[4],
			//Capital:       record[5],
			//TLD:           record[9],
			ContinentCode: record[8],
			//CurrencyCode:  record[10],
			//CurrencyName:  record[11],
			//CallingCode:   record[12],
		})
	}
}
