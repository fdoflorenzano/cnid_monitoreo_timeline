import csv
import json
import os

def loadCSVtoJSON(path):
    with open(path, newline='', encoding="utf-8") as csvfile:
        reader = csv.reader(csvfile)
        dataJson = []
        rownum = 0
        for row in reader:
            if rownum == 0:
                header = row
            else:
                colnum = 0
                datum = {}
                for col in row:
                    datum[header[colnum]] = col
                    colnum += 1
                dataJson.append(datum)
            rownum += 1
        
        new_path = path.replace('csv', 'json')
        with open(new_path, 'w', encoding="utf-8") as f:
            json.dump(translate_institution(dataJson), f, ensure_ascii=False)
            # json.dump((dataJson), f, ensure_ascii=False)

def loadJSON(path):
    with open(path, encoding="utf-8") as file:
        return json.loads(file.read())

def JSONtoDict(JSON, id):
    JSON_dict = {}
    for element in JSON:
        JSON_dict[element[id]] = element
    return JSON_dict

def year_convert(year_string):
    if (year_string == '') or ('-' in year_string) or ('*' in year_string):
        return -1
    else:
        return int(year_string)

def filter_condition(x):
    return ((x['start'] != -1) and
        ('?' not in x['class']) and
        ('-' not in x['class']) and
        ('' != x['class']) and
        ('-' not in x['superior_agency']))
def translate_institution(legislation_array):
    translated_array = []
    for legislation_dict in legislation_array:
        translated_array.append( {
        "id" : legislation_dict["ID"],
        "name" : legislation_dict["Nombre "],
        "start" : year_convert(legislation_dict["Anho_creacion/fecha de promulgación"]),
        "end" : year_convert(legislation_dict["Año_finalizacion"]),
        "superior_agency" : legislation_dict["Agencia_superior"],
        "type" : legislation_dict["tipo_norma"],
        "class" : legislation_dict["clase"],
        "url_agency" : legislation_dict["URL_agencia"],
        "url_law" : legislation_dict["URL_ley"],
        "url_bcn" : legislation_dict["URL_BCN"],
        })
    
    return list(filter(lambda x: filter_condition(x) ,translated_array))


loadCSVtoJSON('./instituciones.csv')