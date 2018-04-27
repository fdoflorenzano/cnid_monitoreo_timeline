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
            json.dump(dataJson, f, ensure_ascii=False)

def loadJSON(path):
    with open(path, encoding="utf-8") as file:
        return json.loads(file.read())

def JSONtoDict(JSON, id):
    JSON_dict = {}
    for element in JSON:
        JSON_dict[element[id]] = element
    return JSON_dict

def translate_legislation(legislation_array):
    translated_array = []
    for legislation_dict in legislation_array:
        translated_array.append( {
        "ministry" : legislation_dict["organismo (Ministerio)"],
        "link" : legislation_dict["link"],
        "matter" : legislation_dict["materia"].split(';'),
        "superior_norm" : legislation_dict["norma_superior"].split(';'),
        "title" : legislation_dict["titulo_norma"],
        "name" : legislation_dict["nombre_norma"],
        "fase" : legislation_dict["fase"],
        "id" : legislation_dict["id_norma_bcn"],
        "start_date" : legislation_dict["inicio_vigencia"],
        "type" : legislation_dict["tipo_norma"],
        "subsecretary" : legislation_dict["Organismo (nivel subsecretaria)"]
        })
    return translated_array


rootDir = '.'
for dirName, subdirList, fileList in os.walk(rootDir):
    for fname in fileList:
        if fname.endswith('.csv'):
            path = dirName + '\\' + fname
            loadCSVtoJSON(path)

rootDir = '.\\json\\'
dict_data_names = ['fase', 'materia', 'norma_superior', 'organismo', 'tipo_norma']
dict_data_ids = {
    'fase': 'id_fase',
    'materia': 'id_materia',
    'norma_superior': 'id_norma_superior',
    'organismo': 'id_institucion', 
    'tipo_norma': 'id_norma'
}
main_data_name = 'legislacion'

data = {}
data['data'] = translate_legislation(loadJSON(rootDir + main_data_name + '.json'))
data['dicts'] = {}
for name in dict_data_names:
    data['dicts'][name] = JSONtoDict(loadJSON(rootDir + name + '.json'),
                                        dict_data_ids[name])

for organismo_id in data['dicts']['organismo'].keys():
    is_present = False
    for leg in data['data']:
        if organismo_id == leg['ministry']:
            is_present = True
    data['dicts']['organismo'][organismo_id]['hasLegislation'] = is_present


with open('.\\output\\data.json', 'w', encoding="utf-8") as file:
    json.dump(data, file, ensure_ascii=False)