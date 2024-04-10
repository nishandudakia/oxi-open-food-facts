import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Camera } from "expo-camera";

const BarcodeScanner = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState(null);
  const [productName, setProductName] = useState("Product name not available");
  const [ecoscore, setEcoscore] = useState("Not available");
  const [manualBarcode, setManualBarcode] = useState("");

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = async ({ data }) => {
    setScanned(true);
    setBarcode(data);

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${data}.json`
      );
      const result = await response.json();

      if (result.status === 1) {
        const product = result.product;
        let ecoScore = product.ecoscore_grade || "Not available";

        if (ecoScore === "Not available") {
          // If ecoscore is not available, search for a similar product
          ecoScore = await getEcoscoreForSimilarProduct(product.product_name);
        }

        setEcoscore(ecoScore);

        const productName = product.product_name || "Product name not available";
        setProductName(productName);
      } else {
        console.error("Open Food Facts API error:", result.status_verbose);
        setEcoscore("Not available");
        setProductName("Product name not available");
      }
    } catch (error) {
      console.error("Error fetching data from Open Food Facts API", error);
      setEcoscore("Not available");
      setProductName("Product name not available");
    }
  };

  const getEcoscoreForSimilarProduct = async (productName) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${productName}&search_simple=1&action=process&json=1`
      );
      const result = await response.json();

      if (result.status === 1 && result.products.length > 0) {
        // Retrieve the ecoscore from the first result
        const similarProduct = result.products[1];
        return similarProduct.ecoscore_grade || "Not available";
      }

      // If no similar product found, return "Not available"
      return "Not available";
    } catch (error) {
      console.error("Error fetching data for similar product", error);
      return "Not available";
    }
  };

  const handleSubmitManualBarcode = async () => {
    if (manualBarcode) {
      setScanned(true);
      setBarcode(manualBarcode);

      try {
        const response = await fetch(
          `https://world.openfoodfacts.org/api/v2/product/${manualBarcode}.json`
        );
        const result = await response.json();

        if (result.status === 1) {
          const product = result.product;
          let ecoScore = product.ecoscore_grade || "Not available";

          if (ecoScore === "Not available") {
            // If ecoscore is not available, search for a similar product
            ecoScore = await getEcoscoreForSimilarProduct(product.product_name);
          }

          setEcoscore(ecoScore);

          const productName = product.product_name || "Product name not available";
          setProductName(productName);
        } else {
          console.error("Open Food Facts API error:", result.status_verbose);
          setEcoscore("Not available");
          setProductName("Product name not available");
        }
      } catch (error) {
        console.error("Error fetching data from Open Food Facts API", error);
        setEcoscore("Not available");
        setProductName("Product name not available");
      }
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setBarcode(null);
    setEcoscore("Not available");
    setProductName("Product name not available");
    setManualBarcode("");
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          onBarCodeScanned={scanned ? undefined : handleBarcodeScanned}
          style={styles.camera}
        />
      </View>
      <View style={styles.barcodeContainer}>
        <Text style={styles.barcodeText}>{`Scanned Barcode: ${
          barcode || "None"
        }`}</Text>
        {scanned && (
          <>
            <Text style={styles.barcodeText}>{`Product Name: ${productName}`}</Text>
            <Text style={styles.barcodeText}>{`Ecoscore: ${ecoscore}`}</Text>
          </>
        )}
      </View>
      {scanned && (
        <TouchableOpacity
          style={styles.button}
          onPress={resetScanner}
        >
          <Text>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}

      {/* Manual Barcode Input */}
      <View style={styles.manualInputContainer}>
        <TextInput
          style={styles.manualInput}
          placeholder="Enter Barcode"
          value={manualBarcode}
          onChangeText={(text) => setManualBarcode(text)}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmitManualBarcode}
        >
          <Text>Submit Barcode</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  cameraContainer: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    height: "100%",
    aspectRatio: 1,
  },
  barcodeContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  barcodeText: {
    fontSize: 18,
    textAlign: "center",
  },
  button: {
    backgroundColor: "lightgray",
    padding: 15,
    alignItems: "center",
  },
  manualInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 10,
  },
  manualInput: {
    flex: 1,
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginRight: 10,
    paddingHorizontal: 10,
  },
});

export default BarcodeScanner;
