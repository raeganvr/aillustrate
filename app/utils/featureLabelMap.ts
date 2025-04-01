// featureLabelMap.ts

export const featureLabelMap: Record<string, Record<string, string>> = {
    boston: {
      crim: "Crime Rate",
      zn: "Residential Land %",
      indus: "Industrial Area %",
      chas: "River Bound",
      nox: "Nitric Oxide",
      rm: "Avg Rooms",
      age: "Old Houses %",
      dis: "Distance to Work",
      rad: "Radial Highways",
      tax: "Tax Rate",
      ptratio: "Student-Teacher Ratio",
      b: "Black Index",
      lstat: "Lower Status %",
    },
    california: {
      MedInc: "Median Income",
      HouseAge: "House Age",
      AveRooms: "Avg Rooms",
      AveBedrms: "Avg Bedrooms",
      Population: "Population",
      AveOccup: "Avg Occupants",
      Latitude: "Latitude",
      Longitude: "Longitude",
    },
    diabetes: {
      age: "Age",
      sex: "Sex",
      bmi: "BMI",
      bp: "Blood Pressure",
      s1: "Serum S1",
      s2: "Serum S2",
      s3: "Serum S3",
      s4: "Serum S4",
      s5: "Serum S5",
      s6: "Serum S6",
    },
    iris: {
      "sepal length (cm)": "Sepal Length in cm",
      "sepal width (cm)": "Sepal Width in cm",
      "petal length (cm)": "Petal Length in cm",
      "petal width (cm)": "Petal Width in cm",
    },
  };
  
  export function toTitleCase(str: string): string {
    return str
      .replace(/[_-]/g, " ")
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  }
  