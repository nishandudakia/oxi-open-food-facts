import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal } from "react-native";
import { Camera } from "expo-camera/legacy";

const BarcodeScanner = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState(null);
  const [productName, setProductName] = useState("Product name not available");
  const [ecoscore, setEcoscore] = useState("Not available");
  const [productImage, setProductImage] = useState(null); // New state for product image
  const [modalVisible, setModalVisible] = useState(false);

  console.log('ecoscore:' + ecoscore)

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
    console.log(`Scanned Barcode Data: ${data}`);
  
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${data}.json`
      );
      const result = await response.json();
      console.log("API Response:", result);
  
      if (result.status === 1) {
        const product = result.product;
  
        // Log to see what's being returned by the API
        console.log("Product Data:", product);
  
        const ecoScore = product.ecoscore_grade || null;
        const productName = product.product_name || "Product name not available";
        const imageUrl = product.image_url || null;
  
        setProductName(productName);
        setProductImage(imageUrl);
  
        if (ecoScore) {
          setEcoscore(ecoScore);
        } else {
          // Only search for similar products if the ecoscore is null or unavailable
          const similarEcoScore = await getEcoscoreForSimilarProduct(productName);
          setEcoscore(similarEcoScore);
        }
      } else {
        console.error("Open Food Facts API error:", result.status_verbose);
        setEcoscore("Not available");
        setProductName("Product name not available");
        setProductImage(null);
      }
    } catch (error) {
      console.error("Error fetching data from Open Food Facts API", error);
      setEcoscore("Not available");
      setProductName("Product name not available");
      setProductImage(null);
    }
  };
  
  const getEcoscoreForSimilarProduct = async (productName) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${productName}&search_simple=1&action=process&json=1`
      );
      const result = await response.json();

      if (result.status === 1 && result.products.length > 0) {
        const similarProduct = result.products[1];
        return similarProduct.ecoscore_grade || "Not available";
      }

      return "Not available";
    } catch (error) {
      console.error("Error fetching data for similar product", error);
      return "Not available";
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setBarcode(null);
    setEcoscore("Not available");
    setProductName("Product name not available");
    setProductImage(null); // Reset the product image
  };

  const closeModal = () => {
    setModalVisible(false); // Close the modal without resetting the scanned data
  };
  

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={require('./assets/logo.png')} style={styles.logo} />
      </View>

      {/* Button to Open Camera Modal */}
      <TouchableOpacity
        style={[styles.button, styles.cameraButton]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>Open Scanner</Text>
      </TouchableOpacity>

      <View style={styles.barcodeContainer}>
        {productImage && (
          <Image source={{ uri: productImage }} style={styles.productImage} />
        )}
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

      {/* Camera Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <Camera
            onBarCodeScanned={scanned ? undefined : handleBarcodeScanned}
            style={styles.camera}
          />
          {scanned && (
            <TouchableOpacity
              style={styles.button}
              onPress={resetScanner}
            >
              <Text style={styles.buttonText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.closeButton]}
            onPress={closeModal}
          >
            <Text style={styles.buttonText}>Close Scanner</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 50,
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  cameraButton: {
    backgroundColor: "#00C2FF",
    marginHorizontal: 50,
    marginBottom: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  barcodeContainer: {
    alignItems: "center",
  },
  barcodeText: {
    fontSize: 18,
    textAlign: "center",
  },
  button: {
    backgroundColor: "lightgray",
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    borderRadius: 20
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  closeButton: {
    backgroundColor: "#00C2FF",  // Changed color to #00C2FF
    marginTop: 20,
    paddingHorizontal: 20,
    borderRadius: 20
  },
  camera: {
    width: "100%",
    height: "70%",
  },
  productImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 20, // Space between the image and barcode text
  },
});

export default BarcodeScanner;
