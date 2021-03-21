import requests
from bs4 import BeautifulSoup
import re

def parseimg(url):
    text = requests.get(url).text
    soup = BeautifulSoup(text,"lxml")
    qq = soup.find("h1",{"class":"product-card__title"}).text.split(" ")
    title = " ".join(qq[1:])
    regx  =   re.compile(r"\d+",)  
    price = regx.findall(soup.find("div",{"class":"product-card-price__recommend"}).text)
    price = float("".join(price))
    url_img = "https:"+soup.find("img",{"id":"show-img"}).attrs["src"]
    color = "#000"
  
    return {
        "url":url_img,
        "title":title,
        "price":price,
        "color":color
    }

def parse(pages=1):
    path =""
    if pages>1:
        path = f"?PAGEN_1={pages}"
    url =f"https://dodogood.ru/catalog/muzhskie_futbolki/"+path
    text = requests.get(url).text
    soup = BeautifulSoup(text,"lxml")
    items = soup.find_all("li",{"class":"catalog-list__item catalog-list__item_table"})
    response =[]
    for item in items:
        a ="https://dodogood.ru"+item.find("a").attrs["href"]
        q = parseimg(a)
        response.append(q)
        
    return response

response = []

for i in range(1,10):
    d = parse(i)
    for j in d:
        response.append(j)

print()
import json
with open('e.json',"w",encoding="utf-8") as f:
    f.write(json.dumps({"q":response}))