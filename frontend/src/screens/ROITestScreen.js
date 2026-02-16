import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { generateROIs } from '../config/autoROIGenerator';

const { width: screenWidth } = Dimensions.get('window');

const ROITestScreen = () => {
  const [image, setImage] = useState(null);
  const [rois, setRois] = useState([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const selectImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        setImage(imageUri);
        
        // Get image dimensions
        Image.getSize(imageUri, (width, height) => {
          setImageSize({ width, height });
          // Auto-generate ROIs based on actual image size
          const result = generateROIs(width, height);
          setRois(result.rois);
        });
      }
    });
  };

  // Scale ROIs to fit screen display
  const scaleROIToScreen = (roi) => {
    const scale = screenWidth / imageSize.width;
    return {
      ...roi,
      x: roi.x * scale,
      y: roi.y * scale,
      width: roi.width * scale,
      height: roi.height * scale
    };
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={selectImage}>
        <Text style={styles.buttonText}>Select Template Image</Text>
      </TouchableOpacity>

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          
          {/* Draw ROIs on top of image */}
          <View style={styles.overlay}>
            {rois.map((roi, index) => {
              const scaledRoi = scaleROIToScreen(roi);
              return (
                <View
                  key={index}
                  style={[
                    styles.roiBox,
                    {
                      left: scaledRoi.x,
                      top: scaledRoi.y,
                      width: scaledRoi.width,
                      height: scaledRoi.height,
                      backgroundColor: roi.color || 'rgba(255,0,0,0.2)',
                      borderColor: roi.color?.replace('0.3', '1') || 'red'
                    }
                  ]}
                >
                  <Text style={styles.roiLabel}>{roi.label || roi.id}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Show ROI count */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Total ROIs Detected: {rois.length}</Text>
        <Text style={styles.infoText}>Student Boxes: {rois.filter(r => r.type === 'student').length}</Text>
        <Text style={styles.infoText}>Answer Boxes: {rois.filter(r => r.type === 'answer').length}</Text>
        <Text style={styles.infoText}>Checkboxes: {rois.filter(r => r.type === 'checkbox').length}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    width: screenWidth - 40,
    height: 400,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  roiBox: {
    position: 'absolute',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roiLabel: {
    fontSize: 8,
    color: 'black',
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  infoText: {
    fontSize: 16,
    marginVertical: 2,
  },
});

export default ROITestScreen;